#include <iostream>
#include <vector>
#include <string>
#include <queue>

using namespace std;

float findMedianSortedArrays(vector<int> nums1, vector<int> nums2) {
    // Write your code here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Input Declarations
    vector<int> nums1;
    vector<int> nums2;

    // Input Reading
    int size_nums1_1;
    cin >> size_nums1_1;
    nums1.resize(size_nums1_1);
    for (int i_nums1_1 = 0; i_nums1_1 < size_nums1_1; ++i_nums1_1) {
        cin >> nums1[i_nums1_1];
    }

    int size_nums2_1;
    cin >> size_nums2_1;
    nums2.resize(size_nums2_1);
    for (int i_nums2_1 = 0; i_nums2_1 < size_nums2_1; ++i_nums2_1) {
        cin >> nums2[i_nums2_1];
    }

    // Function Call
    float median = findMedianSortedArrays(nums1, nums2);

    // Output
    cout << median << endl;

    return 0;
}
