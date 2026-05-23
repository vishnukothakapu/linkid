import {
  Document,
  Page,
  Text,
  View,
  Link as PdfLink,
  StyleSheet,
} from "@react-pdf/renderer";
import type { User as PrismaUser, Link as PrismaLink } from "@prisma/client";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: "1px solid #e5e5e5",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a7f5a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  bio: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 3,
  },
  email: {
    fontSize: 10,
    color: "#1a7f5a",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: "0.5px solid #e5e5e5",
  },
  aboutText: {
    fontSize: 11,
    color: "#333333",
    lineHeight: 1.6,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderBottom: "0.5px solid #f0f0f0",
  },
  platformName: {
    width: 100,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  arrow: {
    width: 20,
    fontSize: 11,
    color: "#aaaaaa",
  },
  linkUrl: {
    fontSize: 11,
    color: "#1a7f5a",
    textDecoration: "none",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5px solid #e5e5e5",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#aaaaaa",
  },
});

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .toLocaleUpperCase()
    .slice(0, 2);
}

type UserLink = {
  id: string;
  platform: string;
  url: string;
};

export function generateResumePDF({
  user,
  links,
}: {
  user: PrismaUser;
  links: PrismaLink[];
}) {
  const displayName = user.name ?? user.username ?? "";
  const initials = getInitials(displayName);
  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{displayName}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            {user.email && <Text style={styles.email}>{user.email}</Text>}
          </View>
        </View>

        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{user.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profiles & Links</Text>
          {links.map((link) => (
            <View key={link.id} style={styles.linkRow}>
              <Text style={styles.platformName}>{link.platform}</Text>
              <Text style={styles.arrow}>-</Text>
              <PdfLink src={link.url} style={styles.linkUrl}>
                {link.url.replace("https://", "").replace("http://", "")}
              </PdfLink>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {baseUrl}/{user.username}
          </Text>
          <Text style={styles.footerText}>Generated {generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
