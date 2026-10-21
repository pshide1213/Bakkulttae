import ItemDetailClient from './ItemDetailClient';

export const metadata = { title: '품목 — 바꿀때' };

export default async function ItemPage({ params }) {
  const { id } = await params;
  return <ItemDetailClient id={id} />;
}
