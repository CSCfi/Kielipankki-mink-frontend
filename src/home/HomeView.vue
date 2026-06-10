<script setup lang="ts">
import { PhSignOut } from "@phosphor-icons/vue";
import HomeNews from "./HomeNews.vue";
import HomeNewsFeatured from "@/home/HomeNewsFeatured.vue";
import { useAuth } from "@/auth/auth.composable";
import LayoutSection from "@/components/LayoutSection.vue";
import { getLogoutUrl } from "@/auth/sbAuth";
import LoginButton from "@/auth/LoginButton.vue";
import UrlButton from "@/components/UrlButton.vue";
import RouteButton from "@/components/RouteButton.vue";
import minkScreen from "@/assets/mink-screen.png";
import minkScreenDark from "@/assets/mink-screen-dark.png";

const { isAuthenticated, canUserWrite, payload } = useAuth();
const logoutUrl = getLogoutUrl();
</script>

<template>
  <div>
    <HomeNewsFeatured />

    <div class="flex flex-col gap-10 my-10">
      <div class="w-full flex flex-row-reverse flex-wrap items-center gap-20">
        <div class="w-full lg:flex-1 text-lg">
          <i18n-t keypath="home.hero.org" scope="global" tag="p" class="my-2">
            <strong>{{ $t("org.name") }}</strong>
          </i18n-t>
          <i18n-t keypath="home.hero.mink" scope="global" tag="p" class="my-2">
            <strong>Mink</strong>
          </i18n-t>
          <i18n-t
            keypath="home.hero.privacy"
            scope="global"
            tag="p"
            class="my-2"
          >
            <a :href="$t('home.hero.privacy.link.url')">
              {{ $t("home.hero.privacy.link.label") }}
            </a>
          </i18n-t>
          <i18n-t
            keypath="home.hero.readmore"
            scope="global"
            tag="p"
            class="my-2"
          >
            <a :href="$t('docs.url')" target="_blank">
              {{ $t("home.hero.readmore.link.label") }}
            </a>
          </i18n-t>

          <div class="flex justify-center gap-4 p-4 text-center text-xl">
            <div v-if="!isAuthenticated">
              <LoginButton />
            </div>

            <div
              v-if="payload && canUserWrite"
              class="bg-sky-100 dark:bg-sky-900 p-4 rounded-sm shadow-inner flex flex-wrap justify-center items-baseline gap-4"
            >
              <div>{{ $t("welcome", { name: payload.name }) }}</div>

              <RouteButton to="/library" class="button-primary">
                {{ $t("mydata") }}
              </RouteButton>

              <UrlButton :href="logoutUrl">
                <PhSignOut class="inline mb-1 mr-1" />
                {{ $t("logout") }}
              </UrlButton>
            </div>
          </div>
        </div>
        <div class="flex-1">
          <div
            class="bg-sborange-600 dark:bg-sbteal-900 rounded-full aspect-square flex items-center"
          >
            <picture class="shadow-lg image3d">
              <source
                media="(prefers-color-scheme: dark)"
                :srcset="minkScreenDark"
              />
              <img :src="minkScreen" :alt="$t('home.hero.alt')" />
            </picture>
          </div>
        </div>
      </div>

      <HomeNews />

      <div
        class="flex flex-col 2xl:flex-row my-20 gap-20 md:w-4/5 lg:w-2/3 2xl:w-full mx-auto"
      >
        <div
          class="flex-1 flex flex-col md:flex-row 2xl:flex-col items-center gap-6"
        >
          <figure
            class="md:w-1/2 2xl:w-4/5 shadow-lg hover:scale-110 transition-transform"
          >
            <img
              src="@/assets/sparv-screen.png"
              :alt="$t('home.features.sparv.alt')"
            />
          </figure>

          <LayoutSection
            :title="$t('home.features.sparv.title')"
            class="flex-1 my-0 text-center"
          >
            <i18n-t keypath="home.features.sparv.body" scope="global" tag="p">
              <template #sparv>
                <a :href="$t('sparv.url')"><strong>Sparv</strong></a>
              </template>
            </i18n-t>
          </LayoutSection>
        </div>

        <div
          class="flex-1 flex flex-col md:flex-row-reverse 2xl:flex-col items-center gap-6"
        >
          <figure
            class="md:w-1/2 2xl:w-4/5 shadow-lg hover:scale-110 transition-transform"
          >
            <img
              src="@/assets/texts.png"
              :alt="$t('home.features.upload.alt')"
            />
          </figure>

          <LayoutSection
            :title="$t('home.features.upload.title')"
            class="flex-1 my-0 text-center"
          >
            <i18n-t
              keypath="home.features.upload.body"
              scope="global"
              tag="p"
            />

          </LayoutSection>
        </div>

        <div
          class="flex-1 flex flex-col md:flex-row 2xl:flex-col items-center gap-6"
        >
          <figure
            class="md:w-1/2 2xl:w-4/5 shadow-lg hover:scale-110 transition-transform"
          >
            <img
              src="@/assets/korp-screen.png"
              :alt="$t('home.features.explore.alt')"
            />
          </figure>

          <LayoutSection
            :title="$t('home.features.explore.title')"
            class="flex-1 my-0 text-center"
          >
            <i18n-t keypath="home.features.explore.body" scope="global" tag="p">
              <template #korp>
                <a
                  href="https://spraakbanken.gu.se/en/tools/korp"
                  title="About the Korp tool"
                >
                  <strong>Korp</strong>
                </a>
              </template>
              <template #strix>
                <a href="https://spraakbanken.gu.se/strix/">
                  <strong>Strix</strong></a
                >
              </template>
            </i18n-t>
          </LayoutSection>
        </div>

        <div
          class="flex-1 flex flex-col md:flex-row-reverse 2xl:flex-col items-center gap-6"
        >
          <figure
            class="md:w-1/2 2xl:w-4/5 shadow-lg hover:scale-110 transition-transform"
          >
            <img
              src="@/assets/share.png"
              :alt="$t('home.features.share.alt')"
            />
          </figure>

          <LayoutSection
            :title="$t('home.features.share.title')"
            class="flex-1 my-0 text-center"
          >
            <i18n-t keypath="home.features.share.body" scope="global" tag="p" />
            <i18n-t
              keypath="home.features.share.upcoming"
              scope="global"
              tag="p"
              class="italic"
            />
          </LayoutSection>
        </div>
      </div>
    </div>

    <div>
      <p class="max-w-2xl mx-auto mb-2">
        <strong>{{ $t("home.otherdata.title") }}</strong>
        {{ " " }}
        <i18n-t keypath="home.otherdata.body" scope="global">
          <a
            :href="$t('home.otherdata.sbdata.url')"
            :title="$t('home.otherdata.sbdata.title')"
            >Data</a
          >
          <a
            href="https://vlo.clarin.eu/"
            title="CLARIN Virtual Language Observatory"
            >Virtual Language Observatory</a
          >
        </i18n-t>
      </p>
    </div>
  </div>
</template>

<style scoped>
.image3d {
  transform: scale(0.9) perspective(500px) rotateY(3deg);
  transition: transform ease-in-out 300ms;
}
.image3d:hover {
  transform: scale(0.95) perspective(500px) rotateY(6deg);
}
</style>
