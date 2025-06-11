<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { PhQuestion, PhUser } from "@phosphor-icons/vue";
import MinkLogo from "@/page/MinkLogo.vue";
import { getLogoutUrl } from "@/auth/sbAuth";
import { useAuth } from "@/auth/auth.composable";
import LocaleSwitcher from "@/i18n/LocaleSwitcher.vue";
import AdminModeBanner from "@/user/AdminModeBanner.vue";
// Asset path transformation doesn't work in <source srcset> like in <img src>
import logoSbxLight from "@/assets/sprakbankentext-light.svg";
import SpinIndicator from "@/spin/SpinIndicator.vue";

defineProps<{
  large: boolean;
}>();

const { isAuthenticating, payload, canUserWrite } = useAuth();

const route = useRoute();
const isHome = computed(() => route.path == "/");
</script>

<template>
  <header
    class="mb-2 shadow-sm bg-white text-gray-600 dark:bg-zinc-800 dark:text-zinc-200"
  >
    <div class="container py-4 flex justify-between flex-wrap gap-4">
      <component :is="isHome ? 'h1' : 'div'" class="text-4xl">
        <router-link to="/" class="text-current">
          <MinkLogo :large="large" />
        </router-link>
      </component>

      <div class="ml-auto flex items-center gap-4">
        <SpinIndicator v-if="isAuthenticating" />
        <div class="self-stretch flex flex-col justify-end items-end">
          <div class="w-56">
            <a href="https://www.kielipankki.fi/">
              <picture>
                <img
                  src="@/assets/kp_logo.png"
                  alt="Kielipankki"
                />
              </picture>
            </a>
          </div>

          <div class="mt-2 flex flex-wrap gap-x-4 items-baseline justify-end">
            <template v-if="payload">
              <router-link
                v-if="canUserWrite"
                to="/user"
                class="no-underline hover:underline"
              >
                <PhUser class="inline-block mb-0.5"></PhUser>
                {{ payload.name }}
              </router-link>
              <a
                v-else
                :href="getLogoutUrl()"
                class="no-underline hover:underline"
              >
                <PhUser class="inline-block mb-0.5"></PhUser>
                {{ $t("logout") }}
              </a>
            </template>

            <a
              :href="$t('docs.url')"
              target="_blank"
              class="no-underline hover:underline"
            >
              <PhQuestion class="inline-block mb-0.5"></PhQuestion>
              {{ $t("docs.label") }}
            </a>

            <LocaleSwitcher />
          </div>
        </div>

        <div class="-my-4">
          <a href="https://www.kielipankki.fi/">
            <img
              src="@/assets/Possu-korp.png"
              alt="Kielipankki"
              :class="[large ? 'h-32' : 'h-24']"
            />
          </a>
        </div>
      </div>
    </div>

    <AdminModeBanner />
  </header>
</template>
