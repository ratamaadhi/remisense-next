import fs from "fs";
import path from "path";
import { PanduanClient } from "@/components/panduan/PanduanClient";

export const metadata = {
  title: "Panduan Bermain Remi — RemiSense",
  description: "Panduan lengkap cara bermain kartu Remi",
};

export default function PanduanPage() {
  const filePath = path.join(process.cwd(), "docs", "panduan-bermain-remi.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return <PanduanClient content={content} />;
}
