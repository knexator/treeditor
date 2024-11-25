typedef struct {
    float x;
    float y;
} Point;

// WASM: (pointer, x, y) -> void; writes xy at pointer
Point create_point(float x, float y) {
    Point p = {x, y};
    return p;
}

// WASM: (dst_pointer, src_pointer, dx, dy)
Point translate_point(Point p, float dx, float dy) {
    Point result = {p.x + dx, p.y + dy};
    return result;
}

Point scale_point(Point p, float factor) {
    Point result = {p.x * factor, p.y * factor};
    return result;
}

// WASM: dst_ptr, p1_ptr, p2_ptr
Point add_points(Point p1, Point p2) {
    Point result = {p1.x + p2.x, p1.y + p2.y};
    return result;
}

Point sub_points(Point p1, Point p2) {
    Point result = {p1.x - p2.x, p1.y - p2.y};
    return result;
}

// WASM: (p1_ptr, p2_ptr) -> f32; doesn't call sub_points!
float distanceSquared(Point p1, Point p2) {
    Point delta = sub_points(p1, p2);
    return delta.x * delta.x + delta.y * delta.y;
}

// // Function to print a point
// void print_point(Point p) {
//     printf("Point(x: %.2f, y: %.2f)\n", p.x, p.y);
// }

// int main() {
//     // Create a point
//     Point p1 = create_point(2.0, 3.0);
//     printf("Original point: ");
//     print_point(p1);

//     // Translate the point
//     Point p2 = translate_point(p1, 1.0, -1.0);
//     printf("Translated point: ");
//     print_point(p2);

//     // Scale the point
//     Point p3 = scale_point(p2, 2.0);
//     printf("Scaled point: ");
//     print_point(p3);

//     // Add two points
//     Point p4 = add_points(p1, p3);
//     printf("Sum of points: ");
//     print_point(p4);

//     return 0;
// }
