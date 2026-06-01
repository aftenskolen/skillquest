import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "skillquest-studio",
  title: "Skillquest",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Innhold")
          .items([
            S.listItem()
              .title("Forside")
              .id("forside")
              .child(
                S.document()
                  .schemaType("forside")
                  .documentId("singleton-forside")
                  .title("Forside")
              ),
            S.divider(),
            S.listItem()
              .title("Kursstyring")
              .schemaType("kurs_visning")
              .child(
                S.documentTypeList("kurs_visning").title("Kursstyring")
              ),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
