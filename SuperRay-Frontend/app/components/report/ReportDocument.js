/* eslint-disable jsx-a11y/alt-text -- react-pdf Image has no alt prop */
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDateTime } from '../../../utils/format';
import { SAMPLE_REPORT_NOTICE } from '../../../utils/demo';
import { DISCLAIMER } from './ReportView';

const styles = StyleSheet.create({
    page: { padding: 36, fontSize: 11, color: '#1e293b', fontFamily: 'Helvetica' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 12,
    },
    logo: { width: 140 },
    meta: { fontSize: 9, color: '#64748b', textAlign: 'right' },
    sample: { marginTop: 12, padding: 8, fontSize: 9, backgroundColor: '#fffbeb', color: '#78350f' },
    imageWrap: { marginTop: 20, alignItems: 'center' },
    image: { maxWidth: 320, maxHeight: 360, objectFit: 'contain' },
    caption: { marginTop: 6, fontSize: 9, color: '#64748b' },
    heading: { marginTop: 20, fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    label: { marginTop: 8, fontSize: 10, color: '#64748b' },
    body: { marginTop: 6, lineHeight: 1.35 },
    footer: {
        position: 'absolute',
        bottom: 28,
        left: 36,
        right: 36,
        fontSize: 8,
        color: '#64748b',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 8,
    },
});

const ReportDocument = ({ report, imageUrl, logoUrl, isSample }) => (
    <Document title={isSample ? 'SuperRay sample report' : `SuperRay report #${report.id}`} author="SuperRay">
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Image src={logoUrl} style={styles.logo} />
                <View>
                    <Text style={styles.meta}>Report {isSample ? 'SAMPLE' : `#${report.id}`}</Text>
                    <Text style={styles.meta}>{formatDateTime(report.date)}</Text>
                </View>
            </View>
            {isSample && <Text style={styles.sample}>{SAMPLE_REPORT_NOTICE}</Text>}
            <View style={styles.imageWrap}>
                <Image src={imageUrl} style={styles.image} />
                <Text style={styles.caption}>{isSample ? 'Sample' : 'Upscaled'} {report.domain} image</Text>
            </View>
            <Text style={styles.heading}>Findings</Text>
            <Text style={styles.label}>Domain: {report.domain || 'Unknown'}</Text>
            <Text style={styles.body}>{report.diagnose}</Text>
            <Text style={styles.footer} fixed>Disclaimer: {DISCLAIMER}</Text>
        </Page>
    </Document>
);

export default ReportDocument;
