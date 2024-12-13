// 1. Constant Folding and Propagation
int constant_folding() {
    int x = 5 + 3;  // Should be optimized to x = 8 at compile time
    int y = x * 2;  // This might be pre-computed to y = 16
    return y;
}

// 2. Dead Code Elimination
int dead_code_elimination(int a) {
    int unused = 100;  // Compiler should eliminate this unused variable
    int result = a * 2;
    
    if (0) {  // This entire block should be removed
        result = 42;
        printf("This will never be executed");
    }
    
    return result;
}

// 3. Loop Unrolling
int loop_unrolling(int* arr, int size) {
    int sum = 0;
    // Compiler might unroll this loop to reduce branching
    for (int i = 0; i < size; i++) {
        sum += arr[i];
    }
    return sum;
}

// 4. Strength Reduction
int strength_reduction() {
    int x = 10;
    int result = 0;
    
    // Multiplication by constant power of 2 can be replaced by shift
    result = x * 8;  // Might be optimized to x << 3
    
    return result;
}

// 5. Inline Function Optimization
inline int square(int x) {
    return x * x;  // Compiler might inline this function
}

int function_inlining() {
    int a = 5;
    int result = square(a);  // Might be replaced with direct computation
    return result;
}

// 6. Common Subexpression Elimination
int common_subexpression(int a, int b) {
    int x = a * b;
    int y = a * b + 10;  // Compiler can recognize a*b is already computed
    return x + y;
}

// 7. Conditional Expression Optimization
int conditional_optimization(int a, int b) {
    // Compiler might optimize this to avoid branching
    return a > b ? a : b;
}

// 8. Recursive Function Optimization
int fibonacci(int n) {
    // Tail recursion might be optimized to iterative form
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

// 9. Memory Access Optimization
void memory_access_optimization(int* arr, int size) {
    // Compilers might reorder or combine memory accesses
    for (int i = 0; i < size; i++) {
        arr[i] = arr[i] * 2;
    }
}

// 10. Short-circuit Evaluation
int short_circuit(int x, int y) {
    // Compiler can optimize logical operations
    if (x > 0 && y / x > 0) {
        return 1;
    }
    return 0;
}