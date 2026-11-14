import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

export interface ResumeLink {
  title: string;
  url: string;
  platform?: string | null;
}

export interface ResumeUser {
  name?: string | null;
  username: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  skills?: string[];
  links?: ResumeLink[];
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  headline: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    fontSize: 9,
    color: "#4B5563",
  },
  metaLink: {
    color: "#2563EB",
    textDecoration: "none",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#374151",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  bioText: {
    fontSize: 10,
    color: "#1F2937",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillBadge: {
    backgroundColor: "#F3F4F6",
    color: "#1F2937",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  linkTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#111827",
  },
  linkUrl: {
    fontSize: 9,
    color: "#2563EB",
    textDecoration: "none",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9CA3AF",
  },
});

export function generateResumePDF(user: ResumeUser) {
  const displayName = user.name?.trim() || user.username;
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://linkid.in"
  ).replace(/\/$/, "");
  const profileUrl = `${baseUrl}/${user.username}`;

  return (
    <Document title={`${displayName} - Resume`} author={displayName}>
      <Page size="A4" style={styles.page}>
        {/* Header (Private login email intentionally omitted) */}
        <View style={styles.header}>
          <Text style={styles.name}>{displayName}</Text>
          {user.headline && (
            <Text style={styles.headline}>{user.headline}</Text>
          )}
          <View style={styles.metaRow}>
            {user.location && <Text>{user.location}</Text>}
            {user.website && (
              <Link src={user.website} style={styles.metaLink}>
                {user.website}
              </Link>
            )}
            <Link src={profileUrl} style={styles.metaLink}>
              {profileUrl}
            </Link>
          </View>
        </View>

        {/* Summary / Bio */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {user.skills.map((skill, index) => (
                <Text key={`${skill}-${index}`} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Links */}
        {user.links && user.links.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>
            {user.links.map((link, index) => (
              <View key={`${link.url}-${index}`} style={styles.linkRow}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Link src={link.url} style={styles.linkUrl}>
                  {link.url}
                </Link>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>Generated via LinkID ({profileUrl})</Text>
      </Page>
    </Document>
  );
}