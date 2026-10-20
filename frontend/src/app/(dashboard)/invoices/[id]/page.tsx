import { InvoicePage } from "./_components/invoice-page";

type InvoiceViewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function InvoiceViewPage({ params }: InvoiceViewPageProps) {
  return <InvoicePage params={params} mode="view" />;
}
