import os
import re
import random

# 1. Update SaleModal.tsx
sale_modal_path = r"d:\apex_internal\demoApex\src\features\sales\components\SaleModal.tsx"
with open(sale_modal_path, "r", encoding="utf-8") as f:
    sale_content = f.read()

# Fix useEffect
old_use_effect = """  // Load processes khi user search (lazy loading)
  useEffect(() => {
    if (isOpen && step === 1 && (debouncedCandidateSearch || clientFilter || ownerFilter || roleFilter)) {
      loadProcesses();
    }
  }, [isOpen, step, debouncedCandidateSearch, clientFilter, ownerFilter, roleFilter]);"""

new_use_effect = """  // Load processes by default
  useEffect(() => {
    if (isOpen && step === 1) {
      loadProcesses();
    }
  }, [isOpen, step, debouncedCandidateSearch, clientFilter, ownerFilter, roleFilter]);"""

sale_content = sale_content.replace(old_use_effect, new_use_effect)

# Fix empty state UI
old_empty_state = """              ) : !candidateSearch && !clientFilter && !ownerFilter && !roleFilter ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Search size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Enter search criteria</p>
                  <p className="text-sm text-gray-400 mt-1">Search by candidate name/email, customer, recruiter or role</p>
                </div>
              ) : processes.length === 0 ? ("""

new_empty_state = """              ) : processes.length === 0 ? ("""

sale_content = sale_content.replace(old_empty_state, new_empty_state)

with open(sale_modal_path, "w", encoding="utf-8") as f:
    f.write(sale_content)


# 2. Update mocks/processes.ts
processes_path = r"d:\apex_internal\demoApex\src\mocks\processes.ts"
with open(processes_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the first 5 occurrences of process_status
statuses_to_inject = ['OFFER_ACCEPTED_BY_CANDIDATE', 'ONBOARDING', 'PASSED_PROBATION', 'OFFER_ACCEPTED_BY_CANDIDATE', 'ONBOARDING']
count = 0

def replace_status(match):
    global count
    if count < len(statuses_to_inject):
        status = statuses_to_inject[count]
        count += 1
        return f"process_status: '{status}'"
    return match.group(0)

new_content = re.sub(r"process_status:\s*'[^']+'", replace_status, content)

with open(processes_path, "w", encoding="utf-8") as f:
    f.write(new_content)
