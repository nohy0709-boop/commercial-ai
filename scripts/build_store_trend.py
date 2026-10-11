"""
상가 스냅샷 파일들로 "지역 x 업종 x 시점"별 점포 수 / 개업(추정) / 폐업(추정)을 계산합니다.

원리
  - 시점마다 받아둔 상가업소 파일(예: 2025년 3월 기준, 2025년 6월 기준 ...)을 비교합니다.
  - 앞 시점에는 있었는데 뒤 시점에 없으면  -> 폐업(추정)
  - 앞 시점에는 없었는데 뒤 시점에 있으면  -> 개업(추정)
  - 같은 가게인지는 '상가업소번호' 같은 고유번호로 판단합니다.

사용법 (프로젝트 폴더에서)
  python scripts/build_store_trend.py  데이터폴더경로  결과.csv

  예)  python scripts/build_store_trend.py C:\\data\\sangga store_trend_monthly.csv

  - 데이터폴더 안의 .csv 파일 이름에 'YYYYMM'(예: 202503)이 들어 있어야 시점을 알 수 있어요.
  - 결과 CSV를 Supabase 의 store_trend_monthly 테이블에 Import 하면 됩니다.

주의
  - 첫 번째 시점은 비교 대상(직전 시점)이 없어서 결과에 나오지 않아요.
  - 양도/이전/업종 변경으로 번호가 바뀌면 개업+폐업으로 같이 잡힐 수 있어요. (추정치)
"""

import re
import sys
from pathlib import Path

import pandas as pd

# ---- 파일의 컬럼 이름 (실제 파일에 맞게 필요하면 바꾸세요) ----
COL_ID = "상가업소번호"          # 가게 고유번호
COL_AREA = "행정동명"            # 지역(행정동)
COL_BIZ = "상권업종중분류명"      # 업종 (앱에서 쓰는 업종 이름과 맞춰야 해요)
COL_SIDO = "시도명"              # 있으면 세종만 걸러냄 (없어도 됨)
SIDO_FILTER = "세종특별자치시"

ALL_BIZ_NAME = "전체"            # 업종 합계를 저장할 이름

# 파일의 업종 이름 -> 앱의 업종 이름으로 바꾸고 싶을 때 여기에 적으세요
BIZ_ALIASES = {
    # "한식": "한식",
}


def read_csv_any(path: Path) -> pd.DataFrame:
    for enc in ("utf-8-sig", "cp949", "euc-kr"):
        try:
            return pd.read_csv(path, dtype=str, encoding=enc)
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"인코딩을 읽을 수 없어요: {path}")


def month_of(path: Path):
    m = re.search(r"(20\d{2})(0[1-9]|1[0-2])", path.stem)
    if not m:
        return None
    return f"{m.group(1)}-{m.group(2)}"


def month_index(month: str) -> int:
    y, m = month.split("-")
    return int(y) * 12 + int(m) - 1


def load_snapshot(path: Path) -> dict:
    """{(area, biz): set(상가업소번호)} 형태로 반환 (업종 합계 '전체' 포함)"""
    df = read_csv_any(path)

    for col in (COL_ID, COL_AREA, COL_BIZ):
        if col not in df.columns:
            raise KeyError(f"{path.name} 에 '{col}' 컬럼이 없어요. 컬럼: {list(df.columns)[:15]}")

    if COL_SIDO in df.columns:
        df = df[df[COL_SIDO] == SIDO_FILTER]

    df = df.dropna(subset=[COL_ID, COL_AREA, COL_BIZ])
    df[COL_BIZ] = df[COL_BIZ].map(lambda b: BIZ_ALIASES.get(b, b))

    result = {}
    for (area, biz), g in df.groupby([COL_AREA, COL_BIZ]):
        result[(area, biz)] = set(g[COL_ID])

    for area, g in df.groupby(COL_AREA):
        result[(area, ALL_BIZ_NAME)] = set(g[COL_ID])

    return result


def main(folder: str, out_path: str) -> None:
    files = []
    for p in sorted(Path(folder).glob("*.csv")):
        month = month_of(p)
        if month:
            files.append((month, p))
        else:
            print(f"건너뜀(파일 이름에 YYYYMM 없음): {p.name}")

    files.sort()
    if len(files) < 2:
        raise SystemExit("비교하려면 시점이 서로 다른 파일이 최소 2개 필요해요.")

    rows = []
    prev_month, prev_data = None, None

    for month, path in files:
        print(f"읽는 중: {month}  {path.name}")
        cur = load_snapshot(path)

        if prev_data is not None:
            interval = max(1, month_index(month) - month_index(prev_month))
            keys = set(cur) | set(prev_data)

            for area, biz in sorted(keys):
                now_ids = cur.get((area, biz), set())
                before_ids = prev_data.get((area, biz), set())

                rows.append(
                    {
                        "area_name": area,
                        "business_name": biz,
                        "month": month,
                        "store_count": len(now_ids),
                        "open_count": len(now_ids - before_ids),
                        "close_count": len(before_ids - now_ids),
                        "interval_months": interval,
                    }
                )

        prev_month, prev_data = month, cur

    out = pd.DataFrame(rows)
    out.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"완료: {len(out)}줄 -> {out_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("사용법: python build_store_trend.py 데이터폴더 결과.csv")
    main(sys.argv[1], sys.argv[2])