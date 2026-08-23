import React, { useState } from 'react';
import { ExamResult } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Sparkles,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as RadarChartIcon,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';

interface AcademicProgressAnalyticsProps {
  examResults: ExamResult[];
  studentName: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': '#06b6d4', // cyan
  'Science': '#10b981', // emerald
  'Social Studies': '#f59e0b', // amber
  'English': '#8b5cf6', // purple
  'Hindi': '#f43f5e'  // rose
};

export const AcademicProgressAnalytics: React.FC<AcademicProgressAnalyticsProps> = ({
  examResults,
  studentName
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [chartView, setChartView] = useState<'trend' | 'subjects' | 'radar'>('trend');

  if (!examResults || examResults.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <LineChartIcon className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Academic Results Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Exam results will appear here once published by your subject teachers.
        </p>
      </div>
    );
  }

  // Sort exam results chronologically
  const sortedExams = [...examResults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare overall trend data
  const overallTrendData = sortedExams.map(e => ({
    examName: e.examType,
    date: e.date,
    percentage: e.percentage,
    totalMarks: e.totalMarks,
    maxMarks: e.maxTotalMarks,
    grade: e.grade
  }));

  // Extract unique subjects list
  const allSubjects = Array.from(
    new Set(sortedExams.flatMap(e => e.subjects.map(s => s.subject)))
  );

  // Prepare multi-subject time-series data
  const subjectTimeSeriesData = sortedExams.map(e => {
    const row: Record<string, any> = {
      examName: e.examType,
      date: e.date
    };
    e.subjects.forEach(s => {
      row[s.subject] = s.marksObtained;
    });
    return row;
  });

  // Latest exam data for radar / current status
  const latestExam = sortedExams[sortedExams.length - 1];
  const firstExam = sortedExams[0];

  const radarData = latestExam ? latestExam.subjects.map(s => ({
    subject: s.subject,
    score: s.marksObtained,
    fullMark: s.maxMarks
  })) : [];

  // Stat computations
  const latestPercentage = latestExam ? latestExam.percentage : 0;
  const firstPercentage = firstExam ? firstExam.percentage : 0;
  const totalGrowth = Number((latestPercentage - firstPercentage).toFixed(1));
  const avgPercentage = Number(
    (sortedExams.reduce((acc, curr) => acc + curr.percentage, 0) / sortedExams.length).toFixed(1)
  );

  // Find best performing subject in latest exam
  let bestSubject = { subject: 'N/A', marks: 0 };
  if (latestExam && latestExam.subjects.length > 0) {
    const sorted = [...latestExam.subjects].sort((a, b) => b.marksObtained - a.marksObtained);
    bestSubject = { subject: sorted[0].subject, marks: sorted[0].marksObtained };
  }

  // Find most improved subject between first and latest exam
  let mostImproved = { subject: 'N/A', diff: 0 };
  if (firstExam && latestExam && sortedExams.length > 1) {
    let maxDiff = -999;
    let bestSub = 'N/A';
    latestExam.subjects.forEach(latestSub => {
      const firstSub = firstExam.subjects.find(s => s.subject === latestSub.subject);
      if (firstSub) {
        const diff = latestSub.marksObtained - firstSub.marksObtained;
        if (diff > maxDiff) {
          maxDiff = diff;
          bestSub = latestSub.subject;
        }
      }
    });
    if (maxDiff > 0) {
      mostImproved = { subject: bestSub, diff: maxDiff };
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Academic Progress Analytics
              </span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
              Grade Trends & Growth Trajectory
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Real-time performance metrics for <strong className="text-slate-900 dark:text-slate-100">{studentName}</strong> across {sortedExams.length} term assessments
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartView('trend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                chartView === 'trend'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Overall Trend
            </button>
            <button
              onClick={() => setChartView('subjects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                chartView === 'subjects'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Subject Wise
            </button>
            <button
              onClick={() => setChartView('radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                chartView === 'radar'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <RadarChartIcon className="w-3.5 h-3.5" /> Skill Radar
            </button>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Latest Score
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
              {latestPercentage}%
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              Grade: {latestExam?.grade}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Net Growth
            </span>
            <div className={`text-2xl font-bold font-heading ${totalGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {totalGrowth >= 0 ? `+${totalGrowth}%` : `${totalGrowth}%`}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              From first exam ({firstPercentage}%)
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Best Subject
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-heading truncate">
              {bestSubject.subject}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Top Score: <strong className="text-slate-900 dark:text-white">{bestSubject.marks}/100</strong>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Average Score
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
              {avgPercentage}%
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Across {sortedExams.length} term tests
            </p>
          </div>
        </div>
      </div>

      {/* CHART SECTION 1: Overall Percentage Trend */}
      {chartView === 'trend' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" /> Total Percentage Progression Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking aggregate score percentage from term to term
              </p>
            </div>
            <div className="text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              Target Threshold: 90.0%
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="percentageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="examName"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={val => `${val}%`}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-amber-500/50 text-xs space-y-1">
                          <p className="font-bold text-amber-400 text-sm">{data.examName}</p>
                          <p className="text-slate-300">Date: {data.date}</p>
                          <p className="text-amber-300 font-bold">Score: {data.percentage}% ({data.grade})</p>
                          <p className="text-slate-400">Total Marks: {data.totalMarks} / {data.maxMarks}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  name="Score %"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#percentageGradient)"
                  activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            {overallTrendData.map((item, idx) => (
              <div
                key={idx}
                className="bg-stone-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{item.examName}</span>
                  <span className="text-[10px] text-slate-500">{item.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-heading block">
                    {item.percentage}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Grade {item.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHART SECTION 2: Subject-Wise Multi Line / Bar Analysis */}
      {chartView === 'subjects' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-500" /> Subject Progress Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare individual subject marks across all examinations
              </p>
            </div>

            {/* Filter by Subject */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              <button
                onClick={() => setSelectedSubject('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedSubject === 'All'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All Subjects
              </button>
              {allSubjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedSubject === sub
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {selectedSubject === 'All' ? (
                <LineChart data={subjectTimeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="examName" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[50, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '1rem',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  {allSubjects.map(sub => (
                    <Line
                      key={sub}
                      type="monotone"
                      dataKey={sub}
                      name={sub}
                      stroke={SUBJECT_COLORS[sub] || '#8b5cf6'}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={subjectTimeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="examName" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '1rem',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar
                    dataKey={selectedSubject}
                    name={selectedSubject}
                    fill={SUBJECT_COLORS[selectedSubject] || '#6366f1'}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART SECTION 3: Skill Radar Chart & AI Performance Insights */}
      {chartView === 'radar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <RadarChartIcon className="w-5 h-5 text-emerald-500" /> Subject Mastery Radar
              </h3>
              <p className="text-xs text-slate-500">
                Latest Assessment ({latestExam?.examType}) Subject Balance
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" opacity={0.4} />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                  <Radar
                    name={studentName}
                    dataKey="score"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#f59e0b',
                      borderRadius: '1rem',
                      fontSize: '12px',
                      color: '#ffffff'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights & Teacher Recommendations Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  Academic Growth Insights
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      Overall Positive Growth
                    </strong>
                    Your marks increased by {totalGrowth}% from Unit Test 1 ({firstPercentage}%) to Pre-Board ({latestPercentage}%).
                  </div>
                </div>

                {mostImproved.subject !== 'N/A' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-start gap-2.5">
                    <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-blue-800 dark:text-blue-300 block">
                        Most Improved Subject: {mostImproved.subject}
                      </strong>
                      Gained +{mostImproved.diff} marks over the academic session through diligent coursework!
                    </div>
                  </div>
                )}

                <div className="p-3 bg-stone-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-white block">
                      Target Focus Recommendation
                    </strong>
                    Maintain consistent speed solving sample CBSE mock test papers for Mathematics and Science to guarantee A1 distinction in Final Boards.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Verified by MPS Sikta Exam Controller</span>
              <span className="font-bold text-amber-600">Updated: 2026-08-02</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
