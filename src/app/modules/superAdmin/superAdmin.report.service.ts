import httpStatus from 'http-status';
import { prisma } from '../../shared/prisma';
import { ReportStatus } from '@prisma/client';

const generateReport = async (payload: any) => {
  const { type, dateRange, format } = payload;
  
  // Here we would actually query the DB based on `type` and `dateRange`
  // and format it into a CSV/PDF. Since this is an MVP, we will mock the CSV content 
  // but we WILL save the Report record to the database so it shows dynamically.

  const name = `Custom ${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

  // Insert into DB
  const report = await prisma.report.create({
    data: {
      name,
      type: type.charAt(0).toUpperCase() + type.slice(1),
      dateRange: dateRange.replace(/_/g, " "),
      format: format.toUpperCase(),
      status: ReportStatus.COMPLETED,
    }
  });

  // Mocking file content. In reality we'd upload to S3/Cloudinary and store fileUrl
  // For now we'll just return the report metadata and frontend will show it in history.
  
  return report;
};

const getReportHistory = async () => {
  const reports = await prisma.report.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  return reports;
};

export const SuperAdminReportService = {
  generateReport,
  getReportHistory
};
