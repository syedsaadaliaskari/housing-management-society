import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

type Payment = {
  id: number;
  amount: string;
  method: string;
  status: string;
  payment_date: string;
  reference_number: string | null;
  unit_number: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusColor(status: string) {
  switch (status) {
    case "SUCCESS":
      return "default";
    case "FAILED":
      return "destructive";
    default:
      return "secondary";
  }
}

const CardList = ({
  title,
  payments,
}: {
  title: string;
  payments: Payment[];
}) => {
  if (!payments || payments.length === 0) {
    return (
      <div>
        <h1 className="text-lg font-medium mb-4">{title}</h1>
        <p className="text-sm text-muted-foreground">No transactions found.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-4">{title}</h1>
      <div className="flex flex-col gap-2">
        {payments.map((p) => (
          <Card
            key={p.id}
            className="flex-row items-center justify-between gap-4 p-4"
          >
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
              {p.method.slice(0, 2)}
            </div>
            <CardContent className="flex-1 p-0">
              <CardTitle className="text-sm font-medium">
                Unit {p.unit_number}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusColor(p.status)} className="text-xs">
                  {p.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(p.payment_date)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-0 text-sm font-semibold">
              Rs {Number(p.amount).toLocaleString()}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CardList;
