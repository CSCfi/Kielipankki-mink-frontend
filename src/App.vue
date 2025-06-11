<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import AppHeader from "@/page/AppHeader.vue";
import api from "@/api/api";
import * as util from "@/util";
import { useAuth } from "@/auth/auth.composable";
import useLocale from "@/i18n/locale.composable";
import { useResourceStore } from "@/store/resource.store";
import MessageToasts from "@/message/MessageToasts.vue";
import usePageTitle from "@/page/title.composable";
import BreadcrumbBar from "@/page/BreadcrumbBar.vue";

const { refreshJwt } = useAuth();
useLocale();
// The `title` ref is automatically updated from route meta.
const { title } = usePageTitle();
// Activate automatic updates of the HTML page title.
useTitle(title, { titleTemplate: "%s | Mink" });
const route = useRoute();
const resourceStore = useResourceStore();

const isHome = computed(() => route.path == "/");

// Fetch JWT and use it for all API requests.
refreshJwt();

if (import.meta.env.DEV) {
  window.api = api;
  window.resourceStore = resourceStore;
  window.util = util;
}
</script>

<template>
  <AppHeader :large="isHome" />
  <BreadcrumbBar />
  <MessageToasts />

  <div class="container py-2">
    <router-view />
  </div>

  <div
    class="container py-20 flex justify-center items-center text-sm opacity-70"
  >
    {{ $t("contact") }}: kielipankki@csc.fi
  </div>
</template>
