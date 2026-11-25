import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Sticker } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import { RECIPE_EXAMPLE, RECIPE_LIST } from "@/lib/marketing/content/topics/recipe-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function RecipeListPage() {
  const { ways } = homeCopy("pl");
  return (
    <TopicPage
      id="recipeList"
      locale="pl"
      copy={RECIPE_LIST}
      page="lista-z-przepisu"
      tone="peach"
      sticker="z-koszykiem"
      art={
        <Phone
          image={SCREENS.pl.meal}
          alt={ways.dish.screenAlt}
          sizes="264px"
          className={styles.heroPhone}
          time="16:40"
          priority
        />
      }
      slots={{
        kangur: <Sticker name="skron" className={styles.sticker} />,
        example: (
          <div className={styles.example}>
            {RECIPE_EXAMPLE.map(({ dish, icon, items }, index) => (
              <div
                key={dish}
                className={
                  index === RECIPE_EXAMPLE.length - 1
                    ? `${styles.dish} ${styles.shared}`
                    : styles.dish
                }
              >
                <h3>
                  <span aria-hidden>{icon}</span> {dish}
                </h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ),
        grandma: <Sticker name="z-lista" className={styles.sticker} />,
      }}
    />
  );
}
