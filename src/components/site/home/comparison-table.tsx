import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";
import { HOME_COMPARISON } from "@/lib/site/home-content";

/**
 * "Why Dexta" comparison, patterned on Superside's table: Dexta's row is
 * highlighted; on small screens the table scrolls sideways with the name
 * column pinned.
 */
export function ComparisonTable({
  content = HOME_COMPARISON,
}: {
  content?: typeof HOME_COMPARISON;
} = {}) {
  const { columns, rows } = content;
  return (
    <Section surface="royal">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={content.title} />
          </Heading>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="Comparison table (scrolls sideways on small screens)"
          className="dx-no-scrollbar -mx-4 mt-10 overflow-x-auto px-4 focus-visible:outline-2 focus-visible:outline-brand md:mx-0 md:mt-14 md:px-0"
        >
          <table className="w-full min-w-[560px] md:min-w-[720px] border-separate border-spacing-0 text-left">
            <caption className="sr-only">
              How Dexta compares with other options
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="bg-surface sticky left-0 z-10 w-36 pb-4 md:w-[38%]"
                >
                  <span className="sr-only">Option</span>
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="pb-4 text-center font-[family-name:var(--font-accent)] text-lg font-normal md:text-xl"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hl = "highlight" in row && row.highlight;
                return (
                  <tr key={row.name} className={cn(hl && "text-royal")}>
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-10 py-5 pr-4 align-middle font-normal",
                        hl
                          ? "bg-brand-cyan rounded-l-[10px] pl-5"
                          : "bg-surface border-surface-rule border-b",
                      )}
                    >
                      <span className="block text-base font-bold md:text-lg">
                        {row.name}
                      </span>
                      <span
                        className={cn(
                          "mt-1 hidden leading-snug md:block md:text-sm",
                          hl ? "text-royal/90" : "text-surface-muted",
                        )}
                      >
                        {row.note}
                      </span>
                    </th>
                    {row.values.map((yes, i) => (
                      <td
                        key={columns[i]}
                        className={cn(
                          "py-5 text-center align-middle",
                          hl
                            ? "bg-brand-cyan last:rounded-r-[10px]"
                            : "border-surface-rule border-b",
                        )}
                      >
                        {yes ? (
                          <Check
                            aria-label="Yes"
                            className="mx-auto size-5"
                            strokeWidth={2}
                          />
                        ) : (
                          <X
                            aria-label="No"
                            className={cn(
                              "mx-auto size-5",
                              !hl && "opacity-50",
                            )}
                            strokeWidth={1.5}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
