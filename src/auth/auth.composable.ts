import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { retry } from "@/util";
import api from "@/api/api";
import useSpin from "@/spin/spin.composable";
import {
  fetchJwt,
  hasAccess,
  decodeJwt,
  type JwtSbPayload,
} from "@/auth/sbAuth";
import useMessenger from "@/message/messenger.composable";

/**
 * JWT request slot.
 *
 * Globally, we make only one JWT request at a time. A second request while the
 * first one is pending can re-use that same request promise.
 */
let jwtPromise: Promise<unknown> | undefined = undefined;

/** Timeout slot for the next keepalive/refresh tick. */
let refreshTimer: ReturnType<typeof setTimeout> | undefined = undefined;

/** Whether the presence listeners have been installed (once per page load). */
let presenceInstalled = false;

const payload = ref<JwtSbPayload>();

/**
 * Keepalive heartbeat period, in seconds.
 *
 * Each `/jwt` request resets the auth server's OIDC session inactivity timer, so
 * while the tab is in the foreground we ping a little more often than that
 * timeout to keep the session alive up to its maximum duration — rather than
 * only refreshing once per token lifetime (~1h) and letting the session lapse
 * from inactivity in between. Must be shorter than the server's
 * OIDCSessionInactivityTimeout. A backgrounded tab is left to lapse.
 */
const HEARTBEAT_S = Number(import.meta.env.VITE_JWT_HEARTBEAT_S) || 240;

/** Refresh this many seconds before the token would actually expire. */
const EXPIRY_MARGIN_S = 30;

/** After a transient (non-401) failure, try again this soon. */
const RETRY_S = 30;

export function useAuth() {
  const router = useRouter();
  const route = useRoute();
  const { spin, isPending } = useSpin();
  const { alert } = useMessenger();
  const { t } = useI18n();

  const isAuthenticated = computed<boolean>(() => !!payload.value);
  const canUserAdmin = computed<boolean>(
    () =>
      !!payload.value && hasAccess(payload.value, "other", "mink-app", "ADMIN"),
  );
  const canUserWrite = computed(() => isAuthenticated.value);
  /** Indicates whether a jwt request is currently loading. */
  const isAuthenticating = computed(() => isPending("jwt"));

  /** If not authenticated, redirect to the login page. */
  async function requireAuthentication(callback?: () => void) {
    // First, ensure the jwt has been fetched.
    if (!payload.value) {
      await refreshJwt();
    }
    // If still no jwt, it means the user hasn't authenticated. Show our login page.
    if (!payload.value) {
      // By passing current page as destination param, the user will then be redirected back to where they first attempted to go.
      router.push(`/login?destination=${route.fullPath}`);
      return;
    }
    // When calling `requireAuthentication`, you can optionally specify what should happen upon success.
    callback?.();
  }

  /**
   * Seconds until the next heartbeat: the keepalive period, but never past the
   * token's expiry. Derived from the token's own lifetime (`exp - iat`) so it is
   * immune to client clock skew.
   */
  function nextDelayS(): number {
    if (payload.value?.exp && payload.value?.iat) {
      const lifetime = payload.value.exp - payload.value.iat;
      return Math.max(5, Math.min(HEARTBEAT_S, lifetime - EXPIRY_MARGIN_S));
    }
    return HEARTBEAT_S;
  }

  /** (Re)arm the heartbeat timer. */
  function scheduleHeartbeat(delayS: number) {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(heartbeatTick, Math.max(1, delayS) * 1000);
  }

  /** Ping while the tab is in the foreground; otherwise pause the loop. */
  async function heartbeatTick() {
    // Backgrounded: stop pinging and let the session lapse. We re-arm and
    // refresh eagerly when the tab regains focus (see ensurePresenceListeners).
    if (typeof document !== "undefined" && document.hidden) return;
    // refreshJwt() arms the next tick itself.
    await refreshJwt({ silent: true });
  }

  /**
   * Fetch JWT, store it and use it for the API client, then arm the next
   * heartbeat.
   *
   * A clean "not authenticated" (401) response stops the loop until the user
   * logs in again. A transient failure (auth server blip) keeps the existing
   * token and retries soon, so a momentary network hiccup doesn't silently end
   * an otherwise-valid session.
   *
   * @param silent Suppress the loading indicator and error alert (used by the
   *   background heartbeat so it doesn't flicker the header spinner or nag).
   */
  async function refreshJwt({ silent = false }: { silent?: boolean } = {}) {
    async function fetchAndStoreJwt() {
      let transientError = false;
      try {
        // fetchJwt resolves to undefined on 401, and throws on other errors.
        // Occasional timeouts are retried before giving up.
        const jwtValue = await retry(fetchJwt);
        // Store it to make username etc available to GUI.
        payload.value = jwtValue ? decodeJwt(jwtValue) : undefined;
        // Register it with the API client.
        api.setJwt(jwtValue);
      } catch (error) {
        // Transient failure: keep whatever token we have and retry shortly.
        transientError = true;
        if (!silent) {
          const message = error instanceof Error ? error.message : String(error);
          alert(`${t("login.fail")}: ${message}`);
        }
      }

      // Arm the next tick.
      if (transientError) {
        scheduleHeartbeat(RETRY_S);
      } else if (payload.value) {
        scheduleHeartbeat(nextDelayS());
      } else if (refreshTimer) {
        // Cleanly unauthenticated: stop until the user logs in again.
        clearTimeout(refreshTimer);
        refreshTimer = undefined;
      }
    }
    // Reuse current JWT request or make a new one.
    jwtPromise =
      jwtPromise ||
      (silent ? fetchAndStoreJwt() : spin(fetchAndStoreJwt(), "jwt"));
    await jwtPromise;
    // Free the slot for subsequent refreshes.
    jwtPromise = undefined;

    ensurePresenceListeners();
  }

  /**
   * Install the focus listener once per page load, to drive the heartbeat:
   * paused while backgrounded, resumed (and refreshed) on return.
   */
  function ensurePresenceListeners() {
    if (presenceInstalled || typeof window === "undefined") return;
    presenceInstalled = true;

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Back in the foreground: refresh right away, so a session that lapsed
        // while hidden is detected (and renewed if still valid), and re-arm the
        // heartbeat loop that heartbeatTick() let stop while we were hidden.
        refreshJwt({ silent: true });
      }
    });
  }

  return {
    isAuthenticating,
    isAuthenticated,
    payload,
    canUserAdmin,
    canUserWrite,
    requireAuthentication,
    refreshJwt,
  };
}
