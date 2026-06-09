import { getCoreShellConfig } from "@/components/patterns/core-app-shell";
import { CoreShellFrame } from "@/components/patterns/core-shell-frame";

export default async function CoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { navigation, routeLabels } = await getCoreShellConfig();

  return (
    <CoreShellFrame {...navigation} routeLabels={routeLabels}>
      {children}
    </CoreShellFrame>
  );
}
