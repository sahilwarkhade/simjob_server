#include <iostream>
#include <vector>
#include <string>
#include <queue>

using namespace std;

vector<int> twoSum(vector<int> nums, int target) {
    // Write your code here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Input Declarations
    vector<int> nums;
    int target;

    // Input Reading
    int size_nums_1;
    cin >> size_nums_1;
    nums.resize(size_nums_1);
    for (int i_nums_1 = 0; i_nums_1 < size_nums_1; ++i_nums_1) {
        cin >> nums[i_nums_1];
    }

    cin >> target;

    // Function Call
    vector<int> result = twoSum(nums, target);

    // Output
    for (int i = 0; i < result.size(); ++i) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    cout << endl;

    return 0;
}
