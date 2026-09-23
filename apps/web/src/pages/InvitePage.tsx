import type { InviteMemberOption } from "@foyer/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormField, inputClassName } from "../components/forms/FormField.tsx";
import { AppHeader } from "../components/layout/AppHeader.tsx";
import { PublicFooter } from "../components/layout/PublicChrome.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  acceptInvite,
  claimHouseholdTenant,
  getApiErrorMessage,
  getInvitePreview,
  getMe,
  getTenants,
  registerWithInvite,
} from "../lib/api.ts";
import { resolveAuthDestination } from "../lib/auth-navigation.ts";
import { getToken, setToken } from "../lib/auth-storage.ts";
import { clearGuestMemberSession, saveGuestMemberSession } from "../lib/guest-member.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { DEFAULT_TENANT_COLOR } from "../lib/tenant-colors.ts";
import { btnPrimary, btnSecondary, formCard, inlineError } from "../lib/ui-classes.ts";

export function InvitePage() {
  const { token = "" } = useParams<{ token: string }>();
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
  const navigate = useNavigate();
  const signedIn = Boolean(getToken());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [accountStep, setAccountStep] = useState<"credentials" | "name">("credentials");

  const previewQuery = useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInvitePreview(token),
    enabled: token.length > 0,
    retry: false,
  });

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: signedIn,
    retry: false,
  });

  const householdId = previewQuery.data?.householdId ?? "";
  const isGuest = meQuery.data?.isGuest === true;
  const alreadyMember =
    Boolean(householdId) &&
    meQuery.data?.memberships.some((membership) => membership.householdId === householdId) === true;

  const linkedQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: signedIn && !isGuest && alreadyMember && householdId.length > 0,
  });

  const members = previewQuery.data?.members ?? [];
  const selected = members.find((member) => member.id === selectedId && !member.claimed) ?? null;
  const openMembers = members.filter((member) => !member.claimed);
  const alreadyLinked = linkedQuery.data?.some((tenant) => tenant.isCurrentUser) === true;

  const goToHousehold = async (nextHouseholdId: string, sessionToken: string | null) => {
    if (sessionToken) {
      setToken(sessionToken);
    }
    const path = await resolveAuthDestination(nextHouseholdId);
    navigate(path, { replace: true });
  };

  const guestMutation = useMutation({
    mutationFn: () => {
      if (!selected) {
        throw new Error("Member is required");
      }
      return acceptInvite(token, { mode: "guest", tenantId: selected.id });
    },
    onSuccess: (response) => {
      saveGuestMemberSession({
        householdId: response.householdId,
        tenantId: response.tenantId,
        invitePath: `/invite/${token}`,
      });
      void goToHousehold(response.householdId, response.token);
    },
  });

  const memberMutation = useMutation({
    mutationFn: () => {
      if (!selected) {
        throw new Error("Member is required");
      }
      if (alreadyMember) {
        return claimHouseholdTenant(householdId, selected.id).then(() => ({
          householdId,
          token: null,
          tenantId: selected.id,
        }));
      }
      return acceptInvite(token, { mode: "member", tenantId: selected.id });
    },
    onSuccess: (response) => {
      clearGuestMemberSession();
      void goToHousehold(response.householdId, response.token);
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => {
      const trimmedName = newName.trim();
      if (trimmedName.length > 0) {
        return registerWithInvite(token, {
          email: email.trim(),
          password,
          name: trimmedName,
        });
      }
      if (!selected) {
        throw new Error("Member is required");
      }
      return registerWithInvite(token, {
        email: email.trim(),
        password,
        tenantId: selected.id,
      });
    },
    onSuccess: (response) => {
      clearGuestMemberSession();
      void goToHousehold(response.householdId, response.token);
    },
  });

  const showGuest = !signedIn || isGuest;
  const showAccount = !isGuest && !alreadyLinked;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppHeader homeTo="/" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className={`${formCard} w-full max-w-md`}>
          {previewQuery.isLoading && <ListSkeleton rows={3} />}
          {previewQuery.isError && (
            <ErrorMessage message={getApiErrorMessage(previewQuery.error)} />
          )}
          {previewQuery.isSuccess && (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                {t("inviteTitle", { name: previewQuery.data.householdName })}
              </h1>
              <p className="mt-2 text-sm text-stone-600">{t("inviteBody")}</p>

              {signedIn && meQuery.isLoading && (
                <div className="mt-6">
                  <ListSkeleton rows={2} />
                </div>
              )}

              {(!signedIn || meQuery.isSuccess) && alreadyLinked && (
                <div className="mt-6">
                  <button
                    type="button"
                    className={`${btnPrimary} w-full`}
                    onClick={() => {
                      void goToHousehold(householdId, null);
                    }}
                  >
                    {t("openHousehold")}
                  </button>
                </div>
              )}

              {(!signedIn || meQuery.isSuccess) && !alreadyLinked && (
                <div className="mt-6 space-y-8">
                  {members.length === 0 && (
                    <p className="text-sm text-stone-600">{t("noMembersToJoin")}</p>
                  )}

                  {members.length > 0 && (showGuest || signedIn || accountStep === "name") && (
                    <MemberChoice
                      members={members}
                      selectedId={selected?.id ?? ""}
                      onSelect={(tenantId) => {
                        setSelectedId(tenantId);
                        setNewName("");
                      }}
                    />
                  )}

                  {showGuest && accountStep === "credentials" && members.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-stone-600">{t("guestHint")}</p>
                      {openMembers.length === 0 ? (
                        <p className="text-sm text-stone-600">{t("guestNamesTaken")}</p>
                      ) : (
                        <button
                          type="button"
                          className={`${btnSecondary} w-full`}
                          disabled={guestMutation.isPending || selected === null}
                          onClick={() => guestMutation.mutate()}
                        >
                          {selected
                            ? t("continueAsName", { name: selected.name })
                            : t("continueAsGuest")}
                        </button>
                      )}
                      {guestMutation.isError && (
                        <p className={inlineError}>{getApiErrorMessage(guestMutation.error)}</p>
                      )}
                    </div>
                  )}

                  {showAccount && signedIn && openMembers.length === 0 && (
                    <p className="text-sm text-stone-600">{t("allNamesLinked")}</p>
                  )}

                  {showAccount && signedIn && openMembers.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-stone-600">{t("accountHint")}</p>
                      <button
                        type="button"
                        className={`${btnPrimary} w-full`}
                        disabled={memberMutation.isPending || selected === null}
                        onClick={() => memberMutation.mutate()}
                      >
                        {t("joinWithAccount")}
                      </button>
                      {memberMutation.isError && (
                        <p className={inlineError}>{getApiErrorMessage(memberMutation.error)}</p>
                      )}
                    </div>
                  )}

                  {showAccount && !signedIn && accountStep === "credentials" && (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        setAccountStep("name");
                      }}
                    >
                      <p className="text-sm font-medium text-stone-900">{t("joinByCreatingAccount")}</p>
                      <p className="text-sm text-stone-600">{t("accountCredentialsHint")}</p>
                      <FormField label={tCommon("email")}>
                        <input
                          className={inputClassName}
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                        />
                      </FormField>
                      <FormField label={tCommon("password")}>
                        <input
                          className={inputClassName}
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          minLength={8}
                        />
                      </FormField>
                      <button type="submit" className={`${btnPrimary} w-full`}>
                        {t("continueToName")}
                      </button>
                    </form>
                  )}

                  {showAccount && !signedIn && accountStep === "name" && (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        registerMutation.mutate();
                      }}
                    >
                      <p className="text-sm font-medium text-stone-900">{t("chooseOrAddName")}</p>
                      <p className="text-sm text-stone-600">{t("chooseOrAddNameHint")}</p>
                      <FormField label={t("addNameLabel")}>
                        <input
                          className={inputClassName}
                          value={newName}
                          onChange={(event) => {
                            setNewName(event.target.value);
                            setSelectedId(null);
                          }}
                        />
                      </FormField>
                      <button
                        type="submit"
                        className={`${btnPrimary} w-full`}
                        disabled={
                          registerMutation.isPending ||
                          (newName.trim().length === 0 && selected === null)
                        }
                      >
                        {t("createAccountAndJoin")}
                      </button>
                      <button
                        type="button"
                        className={`${btnSecondary} w-full`}
                        onClick={() => setAccountStep("credentials")}
                      >
                        {tCommon("back")}
                      </button>
                      {registerMutation.isError && (
                        <p className={inlineError}>{getApiErrorMessage(registerMutation.error)}</p>
                      )}
                    </form>
                  )}

                  {!signedIn && accountStep === "credentials" && (
                    <p className="text-sm text-stone-600">
                      {tCommon("alreadyHaveAccount")}{" "}
                      <Link
                        to="/login"
                        state={{ from: `/invite/${token}` }}
                        className="font-medium text-primary"
                      >
                        {tCommon("signInLink")}
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

interface MemberChoiceProps {
  members: InviteMemberOption[];
  selectedId: string;
  onSelect: (tenantId: string) => void;
}

function MemberChoice({ members, selectedId, onSelect }: MemberChoiceProps) {
  const { t } = useTranslation("auth");

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-stone-900">{t("chooseMember")}</legend>
      {members.map((member) => {
        const locked = member.claimed;
        return (
          <label
            key={member.id}
            className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
              locked ? "border-stone-200 text-stone-400" : "border-border text-stone-800"
            }`}
          >
            <input
              type="radio"
              name="invite-member"
              value={member.id}
              checked={selectedId === member.id}
              disabled={locked}
              onChange={() => onSelect(member.id)}
            />
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: member.color ?? DEFAULT_TENANT_COLOR }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 font-medium">{member.name}</span>
            {member.claimed && (
              <span className="shrink-0 text-xs text-stone-500">{t("memberAlreadyLinked")}</span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
