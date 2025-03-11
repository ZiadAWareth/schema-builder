import { Field } from "./Field";
// Table interface
export interface Table {
  id: string;
  name: string;
  fields: Field[];
}
