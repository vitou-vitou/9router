# 7pj examples

Type the slash. Do not paste wave boilerplate.

## All 7 — one job, quote then policy

```text
/7pj do: merge Total Sum Insured like CAR view
```

Expands to wave 1 quote (list+pdf+view+create+edit) then policy wire, all 7 lines.

## One product

```text
/7pj car do: merge Total Sum Insured row  ref: /pl/quotations/1841/pdf
```

```text
/7pj 0196 pdf view do: LoL under Policy Wording
```

## Quote only

```text
/7pj quote-only list pdf do: interest table colspan
```

## Two waves (user gave two jobs)

```text
/7pj w1 do: merge Total SI
/7pj w2 do: left-align amount column
```

Same as:

```text
/7pj do: merge Total SI
do: left-align amount column
```

## Audit

```text
/7pj audit marine quote pdf
```

Path map only. No code.
