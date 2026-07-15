import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { UserAnalyticsSummary } from "@/lib/analytics";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: "1px solid #e5e5e5",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: "#555555",
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
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalCard: {
    flex: 1,
    marginRight: 10,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#f7f7f7",
  },
  totalCardLast: {
    marginRight: 0,
  },
  totalLabel: {
    fontSize: 9,
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1a7f5a",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1px solid #e5e5e5",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "0.5px solid #f0f0f0",
  },
  colLabel: {
    flex: 3,
    fontSize: 10,
  },
  colNum: {
    flex: 1,
    fontSize: 10,
    textAlign: "right",
  },
  headerText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  linkUrl: {
    fontSize: 8,
    color: "#888888",
    marginTop: 1,
  },
  emptyText: {
    fontSize: 10,
    color: "#888888",
    fontStyle: "italic",
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

export function generateAnalyticsPDF({
  summary,
  displayName,
  generatedDate,
}: {
  summary: UserAnalyticsSummary;
  displayName: string;
  generatedDate: string;
}) {
  const rangeLabel =
    summary.rangeDays == null ? "All time" : `Last ${summary.rangeDays} days`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics Report</Text>
          <Text style={styles.subtitle}>
            {displayName ? `${displayName} • ` : ""}
            {rangeLabel}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Clicks</Text>
              <Text style={styles.totalValue}>{summary.totals.totalClicks}</Text>
            </View>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Unique Visitors</Text>
              <Text style={styles.totalValue}>{summary.totals.uniqueClicks}</Text>
            </View>
            <View style={[styles.totalCard, styles.totalCardLast]}>
              <Text style={styles.totalLabel}>Filtered Bot Hits</Text>
              <Text style={styles.totalValue}>{summary.totals.botClicks}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per-link breakdown</Text>
          {summary.links.length === 0 ? (
            <Text style={styles.emptyText}>No link activity in this range.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colLabel, styles.headerText]}>Link</Text>
                <Text style={[styles.colNum, styles.headerText]}>Total</Text>
                <Text style={[styles.colNum, styles.headerText]}>Unique</Text>
                <Text style={[styles.colNum, styles.headerText]}>Bots</Text>
              </View>
              {summary.links.map((link) => (
                <View key={link.id} style={styles.tableRow} wrap={false}>
                  <View style={styles.colLabel}>
                    <Text style={styles.linkLabel}>
                      {link.label || link.platform}
                    </Text>
                    <Text style={styles.linkUrl}>{link.url}</Text>
                  </View>
                  <Text style={styles.colNum}>{link.totalClicks}</Text>
                  <Text style={styles.colNum}>{link.uniqueClicks}</Text>
                  <Text style={styles.colNum}>{link.botClicks}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>LinkId Analytics</Text>
          <Text style={styles.footerText}>Generated {generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
