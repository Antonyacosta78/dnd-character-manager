import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

export interface SaveRowProps {
  abilityLabel: string;
  modifierLabel: string;
  proficiencyLabel: string;
}

export function SaveRow({ abilityLabel, modifierLabel, proficiencyLabel }: SaveRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium text-fg-primary">{abilityLabel}</TableCell>
      <TableCell className="font-ui text-fg-secondary">{modifierLabel}</TableCell>
      <TableCell>
        <Badge intent="info">{proficiencyLabel}</Badge>
      </TableCell>
    </TableRow>
  );
}
