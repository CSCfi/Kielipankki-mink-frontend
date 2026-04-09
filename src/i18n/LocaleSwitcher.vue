<script setup lang="ts">
import { PhGlobe } from "@phosphor-icons/vue";
import { languageNames } from "./i18n";
</script>

<template>
  <div>
    <PhGlobe class="inline mb-0.5" />
    <label class="sr-only" for="locale-select">
      {{ $t("locale.switcher.label") }}
    </label>
    <select
      id="locale-select"
      v-model="$i18n.locale"
      class="bg-transparent border-0 appearance-none"
    >
      <option
        v-for="locale in $i18n.availableLocales"
        :key="locale"
        :value="locale"
      >
        {{ languageNames[locale] }}
      </option>
    </select>
  </div>
</template>

<style scoped>
select.appearance-none {
  padding-right: 1.4em;
  background: url(@/assets/dropdown.svg) no-repeat 95% 50%;
}
</style>
