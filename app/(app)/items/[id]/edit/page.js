import EditItemClient from './EditItemClient';

export const metadata = { title: '품목 수정 — 바꿀때' };

export default async function EditItemPage({ params }) {
  const { id } = await params;
  return <EditItemClient id={id} />;
}
