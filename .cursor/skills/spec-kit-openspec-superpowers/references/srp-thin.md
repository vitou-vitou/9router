# One job. Stay thin. (SRP)

> **Catchphrase:** *One reason to change — or split.*  
> **Standard:** SOLID · Single Responsibility ([Wikipedia](https://en.wikipedia.org/wiki/Single-responsibility_principle)) · Fowler extract-method/class  
> **Stack load:** Phase 4 + G4 with [simple-code-voice.md](simple-code-voice.md) · deep: skill `refactor` → `struct-single-responsibility`

If a function/file does **toast + mutate + route + errors + legacy** → it is **fat**. Split or gate.

---

## 3-second test

Ask: *“If requirement X changes, does only this unit need an edit?”*  
**No** → too many jobs. Extract.

| Unit | One job |
|------|---------|
| Function | One reason to change |
| File / Vue slice | One concern (leave **or** print **or** hydrate) |
| Shared shell | Thin gate → delegate (no god method) |

---

## Sample (pgi · Endorse leave)

**Fat (many jobs in one handler):**

```js
.then((res) => {
  notify(res.data.message, 'success')
  dialog.close()
  data.can_generate = false
  const id = res.data?.data?.master_id ?? res.data?.data?.id ?? res.data?.data?.data_id
  if (id) router.push({ name: '…', params: { id } })
  else router.push({ name: 'Index' })
  // + 422 field dump + legacy branch soup…
})
```

**Thin (one job each · Direct Book):**

```js
.then((res) => {
  dialog.close()
  announce(res.data.message, 'success')
  data.can_generate_endorsement = false
  router.push({
    name: 'PLEndorsementDetail',
    params: {
      id: res.data.data.master_id,           // one contract field
      productCode: productCodeToSlug(code),
    },
  })
})
.catch(() => announce('Something went wrong', 'error'))
```

Legacy path = **separate branch** (`isBur`), not more guesses in the same block.

---

## Do / Don't (attention)

| Do | Don't |
|----|--------|
| Split before grow (new BUR file > fat shared) | God `handleSubmit*` with 5 concerns |
| One API field from known contract | `a ?? b ?? c` predict chains |
| Reuse `vendor` / `node_modules` | New util “for later” |
| Gate DB with `isBur` | Drive-by legacy rewrite |

---

## G4 checklist

- [ ] One job per new/changed function (name ≤ ~3 words)
- [ ] Shared diff = thin branch **or** new slice file
- [ ] No speculative fallbacks / fat error trees
- [ ] Reuse before invent (`AGENTS.md`)
- [ ] **Single portal** — no dual FE+BE for the same hydrate/save gap ([simple-code-voice.md](simple-code-voice.md) · clean pass)

## Triggers

`SRP` · `avoid fat` · `thin` · `single responsibility` → read this + simple-code-voice **before** coding.
