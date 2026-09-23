import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudOnly } from "../deployment/CloudOnly.tsx";
import { useDeploymentMode } from "../../contexts/DeploymentModeContext.tsx";
import {
  createHouseholdInvite,
  getApiErrorMessage,
  getHouseholdAccess,
  getMe,
} from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { showMutationError } from "../../lib/toast.ts";
import { btnPrimary, btnSecondary, card, inlineError } from "../../lib/ui-classes.ts";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { ListSkeleton } from "../ui/Skeleton.tsx";

interface HouseholdAccessSectionProps {
  householdId: string;
}

export function HouseholdAccessSection({ householdId }: HouseholdAccessSectionProps) {
  const { t } = useTranslation("members");
  const { isCloudMode } = useDeploymentMode();
  const queryClient = useQueryClient();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: isCloudMode,
  });

  const accessQuery = useQuery({
    queryKey: queryKeys.householdAccess(householdId),
    queryFn: () => getHouseholdAccess(householdId),
    enabled: isCloudMode && Boolean(householdId),
  });

  const inviteMutation = useMutation({
    mutationFn: () => createHouseholdInvite(householdId),
    onSuccess: async (invite) => {
      const url = `${window.location.origin}/invite/${invite.token}`;
      setInviteUrl(url);
      setCopied(false);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setCopied(false);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.householdAccess(householdId) });
    },
    onError: showMutationError,
  });

  const role = meQuery.data?.memberships.find(
    (membership) => membership.householdId === householdId,
  )?.role;
  const isAdmin = role === "admin";

  return (
    <CloudOnly>
      <section className={card}>
        <h3 className="text-base font-semibold tracking-tight text-stone-900">{t("accessTitle")}</h3>
        <p className="mt-1 text-sm text-stone-600">{t("accessSubtitle")}</p>

        {accessQuery.isLoading && (
          <div className="mt-4">
            <ListSkeleton rows={2} />
          </div>
        )}
        {accessQuery.isError && (
          <div className="mt-4">
            <ErrorMessage
              message={getApiErrorMessage(accessQuery.error)}
              onRetry={() => accessQuery.refetch()}
            />
          </div>
        )}
        {accessQuery.isSuccess && (
          <ul className="mt-4 space-y-2">
            {accessQuery.data.map((member) => (
              <li key={member.userId} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-stone-900">{member.name}</span>
                  {member.email && (
                    <span className="mt-0.5 block truncate text-stone-500">{member.email}</span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">
                  {t(`roles.${member.role}`)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <div className="mt-4 space-y-3">
            <button
              type="button"
              className={btnPrimary}
              disabled={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              {t("createInvite")}
            </button>
            {inviteMutation.isError && (
              <p className={inlineError}>{getApiErrorMessage(inviteMutation.error)}</p>
            )}
            {inviteUrl && (
              <div>
                <p className="text-sm text-stone-600">
                  {copied ? t("inviteCopied") : t("inviteHint")}
                </p>
                <input
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
                  readOnly
                  value={inviteUrl}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button
                  type="button"
                  className={`${btnSecondary} mt-2`}
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteUrl).then(() => setCopied(true));
                  }}
                >
                  {t("copyInvite")}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </CloudOnly>
  );
}
