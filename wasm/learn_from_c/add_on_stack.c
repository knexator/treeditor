extern int add_from_stack (int* first_ptr, int* second_ptr) {
    return *first_ptr + *second_ptr;
}

extern int main_thing(int first, int second) {
    return add_from_stack(&first, &second);
}
