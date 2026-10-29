import { notFound } from "next/navigation";
import { getSchool } from "@/lib/queries";
import { receiptData } from "@/lib/receipt-data";
import { Receipt } from "@/components/receipt";
import { PrintBar } from "../../print-bar";

export default async function PrintReceipt({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [data, school] = await Promise.all([receiptData(id), getSchool()]);
  if (!data || !school) notFound();
  const thermal = school.receiptSize === "THERMAL";
  return (
    <>
      <PrintBar back={`/payments/${id}`} size={thermal ? "80mm" : "A5"} />
      <Receipt school={school} data={data} thermal={thermal} />
    </>
  );
}
