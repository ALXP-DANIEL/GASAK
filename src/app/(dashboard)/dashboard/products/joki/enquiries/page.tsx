import { CategoryOrderEnquiriesPage } from "../../_components/category-order-enquiries-page";

export default function JokiEnquiriesPage() {
  return (
    <CategoryOrderEnquiriesPage
      category="joki"
      title="Joki Buyer Enquiries"
      description="Joki requests placed by buyers. Contact a new buyer on WhatsApp to arrange full payment."
      backHref="/dashboard/products/joki"
      backLabel="Back to Joki"
    />
  );
}
