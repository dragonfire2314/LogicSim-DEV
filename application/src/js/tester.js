export function runTest(lessonID, components) {
    switch (lessonID) {
        case 10:
            testLesson10(components)
            break;
    }
}

function testLesson10(components) {
    console.log("Tester, ", components);
}