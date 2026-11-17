// Maintenance mode has been removed. Anyone landing here goes to the homepage.
import { redirect } from "next/navigation";

export default function Maintenance() {
  redirect("/");
}
