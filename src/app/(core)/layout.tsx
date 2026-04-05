import { redirect } from "next/navigation";

import { getCoreShellConfig } from "@/components/patterns/core-app-shell";
import { CoreShellFrame } from "@/components/patterns/core-shell-frame";
import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";

export default async function CoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionContext = await new AuthSessionContext().getSessionContext();

  if (!sessionContext.userId) {
    redirect("/sign-in");
  }

  const { navigation, routeLabels } = await getCoreShellConfig();

  return (
    <CoreShellFrame {...navigation} routeLabels={routeLabels}>
      {children}
    </CoreShellFrame>
  );
}
