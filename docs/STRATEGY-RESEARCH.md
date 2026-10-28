# Indicator research and model choices

Reviewed 28 October 2026. This document describes the implemented model, not demonstrated trading edge.

## Sources
- Fidelity Fibonacci guide: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/fibonacci-retracement
- Fidelity Fast Stochastic guide: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/fast-stochastic
- John Bollinger's rules: https://www.bollingerbands.com/bollinger-band-rules
- Bailey, Borwein, López de Prado and Zhu, The Probability of Backtest Overfitting: https://www.davidhbailey.com/dhbpapers/backtest-prob.pdf

## Application to this journal
Separate three hypotheses: retracement location, volatility/price context, and momentum timing. Do not treat these related price transformations as independent votes. The existing point weighting is a checklist heuristic, not a calibrated probability. The plan now explains this and links to evidence from the selected market.

Record timeframe, Stochastic variant, rule version, market regime and release context at first log. Preserve initial cash risk and research tags in analysisEntry, alongside the existing first-entry macro snapshot. Legacy entries use their available saved values and may be retrospective. A recorded release-window tag is manual context, not automatically validated economic-event attribution.

## Implemented evaluation
- Net P&L per initial cash risk gives R. Percent-only risk, blank P&L and zero/negative risk are excluded from R. P&L is user supplied and must already include costs.
- Compare rule-present with rule-absent observations under common market, version, timeframe, regime and release-context filters. Show sample counts, mean R and sample standard deviation. Missing legacy checklists are excluded. Unchecked is not proof of absence.
- A diagnostic 70/30 split by exit date keeps the same exit day in a single group. Require at least 10 dated trades and display missing-date exclusions. This is not a purged backtest: overlapping positions, strategy selection and repeated inspection can still leak information.
- To establish a stronger case, freeze the rule version before collecting a genuinely untouched forward period. Record every candidate and skipped setup, not only executed trades, before claiming indicator predictive efficacy. The current journal does not record that universe and cannot estimate a causal effect or an unbiased signal hit rate.
- Existing historical P&L simulations resample fixed-size outcomes. They assume a stable outcome distribution and do not capture clustering, changing exposure, liquidity or unseen tail events. They are scenario exploration, not return prediction.

## 3D views
The cashflow surface plots month, assumed monthly return and ending capital, sharing inputs with the existing numerical table. Cashflows occur at month end; balances floor at zero and hover values disclose unfunded withdrawals. Sensitivity is in percentage points, not estimated volatility or a probability interval.

The trade scatter plots initial checklist points, discipline percentage and realised R. It excludes missing-risk/checklist trades, shows exclusions, caps drawing at 1,000 recent points and keeps full filtered statistics. Click opens the original trade. All trades also have keyboard-accessible links in the evidence library. No external plotting dependency, animation loop or screenshot loading is needed for either chart.

## Checks
Run `node --test tests/research-math.test.mjs` for initial-risk preservation, missing values, R statistics, chronological grouping, cashflow compounding and unfunded withdrawals. Run `node scripts/validate-build.mjs` for the existing build contract. Browser checks should cover the navigation order, plan/research round trip, filters, cashflow controls and chart rotation.

## Boundaries
Device-local journal remains in place. The schema and licensed calendar adapter do not activate the permanent server archive. Cross-device storage, automated release matching, full outcome-path backtests and screenshot interpretation are not supplied by these charts.
