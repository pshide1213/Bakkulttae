import pg from 'pg';

const { Pool, types } = pg;

// DATE 컬럼을 JS Date로 바꾸지 않고 'YYYY-MM-DD' 문자열 그대로 받기 (시간대 문제 방지)
types.setTypeParser(1082, (value) => value);

// 앱이 처음 DB에 접속할 때 테이블을 자동으로 만듭니다.
// (여러 서버가 동시에 실행해도 충돌하지 않도록 잠금을 먼저 잡습니다)
const SCHEMA = `
SELECT pg_advisory_xact_lock(820302);

CREATE TABLE IF NOT EXISTS accounts (
  id             SERIAL PRIMARY KEY,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  name           VARCHAR(30)  NOT NULL,
  household_size SMALLINT     NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id               SERIAL PRIMARY KEY,
  account_id       INTEGER      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name             VARCHAR(60)  NOT NULL,
  area             VARCHAR(20)  NOT NULL DEFAULT '기타',
  cycle_days       INTEGER      NOT NULL CHECK (cycle_days BETWEEN 1 AND 3650),
  last_replaced_on DATE         NOT NULL,
  note             VARCHAR(300),
  ai_reason        VARCHAR(300),
  ai_signs         TEXT,
  ai_tips          TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replacement_logs (
  id          SERIAL PRIMARY KEY,
  item_id     INTEGER      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  account_id  INTEGER      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  replaced_on DATE         NOT NULL,
  memo        VARCHAR(200),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_account ON items (account_id);
CREATE INDEX IF NOT EXISTS idx_logs_item ON replacement_logs (item_id, replaced_on);
`;

const globalForDb = globalThis;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경변수가 없어요. .env.local 파일을 확인하세요.');
  }
  const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);
  const hasSslMode = /sslmode=/.test(connectionString);
  return new Pool({
    connectionString,
    // 주소에 sslmode가 있으면 그대로 따르고, 없으면 클라우드 DB에 SSL로 접속
    ssl: isLocal || hasSslMode ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
}

function getPool() {
  if (!globalForDb.__bakkulPool) {
    globalForDb.__bakkulPool = createPool();
  }
  return globalForDb.__bakkulPool;
}

async function ensureSchema() {
  if (!globalForDb.__bakkulSchema) {
    globalForDb.__bakkulSchema = getPool()
      .query(SCHEMA)
      .catch((error) => {
        globalForDb.__bakkulSchema = null;
        throw error;
      });
  }
  return globalForDb.__bakkulSchema;
}

export async function query(text, params = []) {
  await ensureSchema();
  return getPool().query(text, params);
}
