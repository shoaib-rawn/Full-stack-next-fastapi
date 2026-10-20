import { CustomerPage } from "./_components/customer-page";

type CustomerViewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function CustomerViewPage({
  params,
}: CustomerViewPageProps) {
  return <CustomerPage params={params} mode="view" />;
}
