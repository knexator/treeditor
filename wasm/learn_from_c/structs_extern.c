typedef struct {
    float x;
    float y;
} Point;

// __attribute__((import_module("env"), import_name("externalFunction"))) Point sub_points(Point p1, Point p2);
Point sub_points(Point p1, Point p2);

// WASM: (p1_ptr, p2_ptr) -> f32
// properly uses stack:
// stack_pointer -= 32
// store p1_ptr at stack_ptr+16
// store p2_ptr at stack_ptr+8
// call sub_points(stack_ptr+24, stack_ptr+16, stack_ptr+8)
// store stack_ptr+24 at l3,l4 (local vars)
// stack_pointer += 32
// return l3*l3+l4*l4
float distanceSquared(Point p1, Point p2) {
    Point delta = sub_points(p1, p2);
    return delta.x * delta.x + delta.y * delta.y;
}
