import { useCallback, useEffect, useState } from "react";
import { getDatabaseHealth, getHealth } from "../services/healthService.js";

const initial = { status: "checking", detail: null };

/** Polls the API once on mount (and on refresh) for liveness and DB connectivity. */
export default function useApiHealth() {
  const [api, setApi] = useState(initial);
  const [database, setDatabase] = useState(initial);

  const check = useCallback(async () => {
    setApi(initial);
    setDatabase(initial);
    const [apiRes, dbRes] = await Promise.allSettled([getHealth(), getDatabaseHealth()]);
    setApi(
      apiRes.status === "fulfilled"
        ? { status: "online", detail: apiRes.value }
        : { status: "offline", detail: null }
    );
    setDatabase(
      dbRes.status === "fulfilled"
        ? { status: "online", detail: dbRes.value }
        : { status: "offline", detail: null }
    );
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { api, database, refresh: check };
}
