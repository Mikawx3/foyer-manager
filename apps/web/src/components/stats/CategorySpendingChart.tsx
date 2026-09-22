import type { Category, CategoryExpenseStat } from "@foyer/types";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import {
  categoryIdFromChartClick,
  toCategoryChartSlices,
  type CategoryChartSlice,
} from "../../lib/category-stats.ts";
import { ChartCard } from "../dashboard/ChartCard.tsx";

const CHART_HEIGHT = 280;
const AXIS_TICK = { fill: "#78716c", fontSize: 12 };

interface CategorySpendingChartProps {
  title: string;
  emptyMessage: string;
  byCategory: CategoryExpenseStat[];
  categories: Category[];
  getCategoryLabel: (category: Category) => string;
  highlightedCategoryId?: string;
  onCategoryClick?: (categoryId: string) => void;
}

interface CategoryAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  slices: CategoryChartSlice[];
  onCategoryClick?: (categoryId: string) => void;
}

function CategoryAxisTick({ x, y, payload, slices, onCategoryClick }: CategoryAxisTickProps) {
  const slice = slices.find((entry) => entry.name === payload?.value);
  if (x === undefined || y === undefined || payload === undefined) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={AXIS_TICK.fill}
      fontSize={AXIS_TICK.fontSize}
      className={onCategoryClick && slice ? "cursor-pointer" : undefined}
      onClick={(event) => {
        event.stopPropagation();
        if (slice && onCategoryClick) {
          onCategoryClick(slice.categoryId);
        }
      }}
    >
      {payload.value}
    </text>
  );
}

export function CategorySpendingChart({
  title,
  emptyMessage,
  byCategory,
  categories,
  getCategoryLabel,
  highlightedCategoryId,
  onCategoryClick,
}: CategorySpendingChartProps) {
  const { t: tCommon } = useTranslation("common");
  const { formatCurrency } = useFormat();

  const slices = toCategoryChartSlices(
    byCategory,
    categories,
    getCategoryLabel,
    tCommon("unknown"),
  );

  const chartHeight = Math.max(CHART_HEIGHT, slices.length * 40 + 40);

  const formatValue = (value: unknown): string => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return formatCurrency(value);
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      return formatCurrency(Number.isFinite(numeric) ? numeric : 0);
    }
    return formatCurrency(0);
  };

  const tooltipFormatter = (
    value: unknown,
    _name: unknown,
    item: { payload?: CategoryChartSlice },
  ) => {
    const share = item.payload?.sharePercent;
    const base = formatValue(value);
    if (typeof share === "number" && Number.isFinite(share)) {
      return `${base} (${share.toFixed(1)}%)`;
    }
    return base;
  };

  const handleBarClick = (data: { payload?: CategoryChartSlice }) => {
    if (!onCategoryClick) {
      return;
    }
    const categoryId = categoryIdFromChartClick(slices, {
      activeLabel: data.payload?.name,
    });
    if (categoryId) {
      onCategoryClick(categoryId);
    }
  };

  return (
    <ChartCard title={title} isEmpty={slices.length === 0} emptyMessage={emptyMessage}>
      <div className="select-none outline-none [&_*]:outline-none" tabIndex={-1}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={slices}
            margin={{ left: 8, right: 72, top: 8, bottom: 8 }}
            style={{ outline: "none" }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={
                onCategoryClick
                  ? (props) => (
                      <CategoryAxisTick
                        {...props}
                        slices={slices}
                        onCategoryClick={onCategoryClick}
                      />
                    )
                  : AXIS_TICK
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={24}
              cursor={onCategoryClick ? "pointer" : undefined}
              activeBar={false}
              onClick={onCategoryClick ? handleBarClick : undefined}
            >
              {slices.map((entry) => (
                <Cell
                  key={entry.categoryId}
                  fill={entry.fill}
                  opacity={
                    highlightedCategoryId !== undefined &&
                    highlightedCategoryId !== "" &&
                    entry.categoryId !== highlightedCategoryId
                      ? 0.35
                      : 1
                  }
                />
              ))}
              <LabelList dataKey="value" position="right" formatter={formatValue} fill="#78716c" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
