import { InvoicePage } from "../_components/invoice-page";

type InvoiceEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function InvoiceEditPage({ params }: InvoiceEditPageProps) {
  return <InvoicePage params={params} mode="edit" />;
}
