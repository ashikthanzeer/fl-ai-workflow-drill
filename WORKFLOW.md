# AI Development Workflow Comparison

## Experiment

I implemented the same settings-form feature for StudyPlanner twice using two different AI-assisted development workflows. The goal was to compare a minimal prompting approach with a structured planning and verification approach, focusing on correctness, accessibility, edge cases, and review effort.

## Round 1: Minimal Prompt

The first implementation started with a vague request to build a settings form. I allowed the AI to ask relevant questions before implementation and answered those questions as needed. The resulting implementation was functional and did not contain any substantial bugs. It also did not miss any of the required validation rules. I performed the testing manually rather than having the AI create a dedicated test suite.

This showed that a relatively small amount of initial context, combined with AI-led clarification, was sufficient to produce a working feature for a well-bounded task.

## Round 2: Structured Planning

The second implementation used a detailed specification containing requirements, validation rules, accessibility constraints, edge cases, expected behavior, and an explicit verification process. I also used Plan mode before implementation.

The structured approach produced a slightly better result, particularly in accessibility and overall organization. The improvement was not dramatic because the first implementation was already functional. However, Plan mode helped the AI reason about the feature more systematically before writing code.

Round 2 also produced six automated tests covering important validation and interaction scenarios. This provided stronger and more repeatable verification than the manual testing performed in Round 1.

## Comparison

### Correctness

Both implementations were functionally correct, with no substantial bugs observed. Round 2 provided greater confidence because its behavior was supported by automated tests.

### Accessibility

Round 2 showed a small improvement in accessibility because accessibility requirements were explicitly included in the specification. The difference was useful but not significant.

### Edge Cases

Both implementations handled the required validation and important edge cases. The structured prompt made these requirements explicit rather than relying on the AI to infer them.

### Review Effort

Round 2 required more review of the AI's output because the workflow involved a plan, implementation, tests, and verification. However, this additional review also provided greater visibility into how the feature was constructed and validated.

## Conclusion

The experiment showed that vague prompting can be effective for small, well-defined features when the AI is allowed to clarify requirements. Structured planning becomes more valuable when correctness, accessibility, edge cases, and repeatable verification matter. In this case, it did not dramatically improve the final functionality, but it produced a more deliberate development process and stronger automated verification.
