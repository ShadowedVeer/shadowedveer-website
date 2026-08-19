import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const recordVisit = createServerFn({ method: "POST" }).handler(
  async () => {
    const sql = await getSql();
    const rows = await sql<{ views: number }>`
      insert into page_stats (id, views)
      values ('profile', 1)
      on conflict (id) do update
        set views = page_stats.views + 1
      returning views
    `;
    return rows[0]?.views ?? 1;
  },
);
