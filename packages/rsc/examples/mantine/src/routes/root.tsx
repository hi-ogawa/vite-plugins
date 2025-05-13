import "@mantine/core/styles.css";
import { Anchor, MantineProvider, Text, Title } from "@mantine/core";
import { theme } from "../theme";

export function Root() {
  return (
    <html lang="en" data-mantine-color-scheme="light">
      <head>
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Welcome />
        </MantineProvider>
      </body>
    </html>
  );
}

function Welcome() {
  return (
    <>
      <Title ta="center" mt={100}>
        Welcome to{" "}
        <Text
          inherit
          variant="gradient"
          component="span"
          gradient={{ from: "pink", to: "yellow" }}
        >
          Mantine
        </Text>
      </Title>
      <Text c="dimmed" ta="center" size="lg" maw={580} mx="auto" mt="xl">
        This starter Next.js project includes a minimal setup for server side
        rendering, if you want to learn more on Mantine + Next.js integration
        follow{" "}
        <Anchor href="https://mantine.dev/guides/next/" size="lg">
          this guide
        </Anchor>
        . To get started edit page.tsx file.
      </Text>
    </>
  );
}
