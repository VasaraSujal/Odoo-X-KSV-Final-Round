export const metadata = {
  title: 'Cart | DriveFleet',
  description: 'Your rental cart.',
};

export default function CartPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Cart</h1>
      <div className="rounded-2xl border border-border bg-white p-8 text-center text-secondary">
        Items you add for rent will appear here.
      </div>
    </div>
  );
}
