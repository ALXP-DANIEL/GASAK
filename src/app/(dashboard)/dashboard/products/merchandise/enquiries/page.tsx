import { CategoryOrderEnquiriesPage } from "../../_components/category-order-enquiries-page";

export default function MerchandiseEnquiriesPage() {
  return (
    <CategoryOrderEnquiriesPage
      category="merchandise"
      title="Merchandise Buyer Enquiries"
      description="Merchandise orders placed by buyers, including delivery and payment status."
      backHref="/dashboard/products/merchandise"
      backLabel="Back to Merchandise"
    />
  );
}
