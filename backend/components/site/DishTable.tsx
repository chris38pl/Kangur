import topic from "@/components/pages/TopicPage.module.css";
import prose from "@/components/site/prose.module.css";
import { TABLE_PEOPLE, dishTable } from "@/lib/marketing/lists/dish-table";

/** Products dish by dish, computed from the same data as the calculator. */
export function DishTable() {
  return (
    <div className={prose.tableWrap}>
      <table className={`${prose.table} ${topic.table} ${topic.plain} ${topic.stack}`} role="table">
        <caption className="visually-hidden">
          Produkty na dwanaście potraw wigilijnych dla {TABLE_PEOPLE} osób
        </caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              Danie
            </th>
            <th scope="col" role="columnheader">
              Produkty
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {dishTable().map(({ dish, products }) => (
            <tr key={dish} role="row">
              <th scope="row" role="rowheader">
                {dish}
              </th>
              <td role="cell">{products}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
