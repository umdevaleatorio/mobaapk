import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import { isHoliday } from '../../../../utils/shopHours';

export function useAdminDashboardCharts(orders: any[]) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);
  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);
  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end' | 'cash_range_start' | 'cash_range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadPersistedDates = async () => {
      try {
        const storedStart = await AsyncStorage.getItem('admin_dashboard_startDate');
        const storedEnd = await AsyncStorage.getItem('admin_dashboard_endDate');
        const storedIsRange = await AsyncStorage.getItem('admin_dashboard_isRange');
        const storedHasFiltered = await AsyncStorage.getItem('admin_dashboard_hasFiltered');
        if (storedStart) setStartDate(new Date(storedStart));
        if (storedEnd) setEndDate(new Date(storedEnd));
        if (storedIsRange) setIsRange(storedIsRange === 'true');
        if (storedHasFiltered) setHasFiltered(storedHasFiltered === 'true');
      } catch (error) {
        console.error('Error loading persisted dashboard dates:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPersistedDates();
  }, []);

  const handleChartDateSelect = (mode: string, date: Date) => {
    if (mode === 'single') {
      const isSun = date.getDay() === 0;
      const isHol = isHoliday(date);
      if (isSun || isHol) {
        setShowSundayHolidayModal(true);
        return;
      }
      setPrevStartDate(startDate);
      setPrevEndDate(endDate);
      setPrevIsRange(isRange);
      setPrevHasFiltered(hasFiltered);
      setStartDate(date);
      setEndDate(date);
      setIsRange(false);
      setHasFiltered(true);
      setShowFilterOptionModal(false);
    } else if (mode === 'range_start') {
      setLocalStartDate(date);
    } else if (mode === 'range_end') {
      setLocalEndDate(date);
    }
  };

  const handleCloseSundayHolidayModal = () => {
    setShowSundayHolidayModal(false);
    setStartDate(prevStartDate);
    setEndDate(prevEndDate);
    setIsRange(prevIsRange);
    setHasFiltered(prevHasFiltered);
  };

  const getSingleDayTitle = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje:";
    if (diffDays === 1) return "Ontem:";
    if (diffDays === 2) return "Anteontem:";
    return "Neste dia:";
  };

  const getDynamicTitle = () => {
    if (!hasFiltered) return "Ganhos:";
    if (isRange) {
      const startD = startDate.getDate();
      const startM = startDate.getMonth();
      const startY = startDate.getFullYear();
      const endD = endDate.getDate();
      const endM = endDate.getMonth();
      const endY = endDate.getFullYear();
      if (startD === endD && startM === endM && startY === endY) {
        return getSingleDayTitle(startDate);
      }
      return "No Período:";
    }
    return getSingleDayTitle(startDate);
  };

  const generateChartPoints = () => {
    const GRAPH_WIDTH = Dimensions.get('window').width - 32;
    const GRAPH_HEIGHT = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 20;
    const chartWidth = GRAPH_WIDTH - paddingLeft - paddingRight;
    const chartHeight = GRAPH_HEIGHT - paddingTop - paddingBottom;

    if (!isRange || startDate.getTime() === endDate.getTime()) {
      const slots = [
        { label: '08h', sales: 0 },
        { label: '10h', sales: 0 },
        { label: '12h', sales: 0 },
        { label: '14h', sales: 0 },
        { label: '16h', sales: 0 },
        { label: '18h', sales: 0 },
      ];
      orders.forEach((o) => {
        const orderHour = new Date(o.created_at).getHours();
        if (orderHour < 9) slots[0].sales += o.total ?? 0;
        else if (orderHour < 11) slots[1].sales += o.total ?? 0;
        else if (orderHour < 13) slots[2].sales += o.total ?? 0;
        else if (orderHour < 15) slots[3].sales += o.total ?? 0;
        else if (orderHour < 17) slots[4].sales += o.total ?? 0;
        else slots[5].sales += o.total ?? 0;
      });
      const maxVal = Math.max(...slots.map((s) => s.sales), 100);
      const points = slots.map((s, idx) => {
        const x = paddingLeft + (idx / (slots.length - 1)) * chartWidth;
        const y = GRAPH_HEIGHT - paddingBottom - (s.sales / maxVal) * chartHeight;
        return { x, y, label: s.label, value: s.sales };
      });
      return { points, maxVal, width: GRAPH_WIDTH, height: GRAPH_HEIGHT, paddingBottom, paddingLeft };
    } else {
      const daysCount = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daySales: Record<string, number> = {};
      for (let i = 0; i < Math.min(daysCount, 10); i++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + i);
        const key = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        daySales[key] = 0;
      }
      orders.forEach((o) => {
        const key = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (daySales[key] !== undefined) {
          daySales[key] += o.total ?? 0;
        } else {
          daySales[key] = o.total ?? 0;
        }
      });
      const keys = Object.keys(daySales);
      const maxVal = Math.max(...Object.values(daySales), 100);
      const points = keys.map((k, idx) => {
        const x = paddingLeft + (idx / (keys.length - 1)) * chartWidth;
        const y = GRAPH_HEIGHT - paddingBottom - (daySales[k] / maxVal) * chartHeight;
        return { x, y, label: k, value: daySales[k] };
      });
      return { points, maxVal, width: GRAPH_WIDTH, height: GRAPH_HEIGHT, paddingBottom, paddingLeft };
    }
  };

  return {
    startDate, endDate, isRange, hasFiltered, isLoaded,
    prevStartDate, prevEndDate, prevIsRange, prevHasFiltered,
    showFilterOptionModal, showSundayHolidayModal,
    pickerMode, showPicker, localStartDate, localEndDate,
    setStartDate, setEndDate, setIsRange, setHasFiltered,
    setPrevStartDate, setPrevEndDate, setPrevIsRange, setPrevHasFiltered,
    setShowFilterOptionModal, setShowSundayHolidayModal,
    setPickerMode, setShowPicker, setLocalStartDate, setLocalEndDate,
    handleChartDateSelect,
    handleCloseSundayHolidayModal,
    getDynamicTitle,
    generateChartPoints,
  };
}
