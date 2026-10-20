import { CustomerPage } from "../_components/customer-page";

type CustomerEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function CustomerEditPage({
  params,
}: CustomerEditPageProps) {
  return <CustomerPage params={params} mode="edit" />;
}
