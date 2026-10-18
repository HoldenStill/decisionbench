import pytest

@pytest.mark.asyncio
async def test_scenarios_crud(client):
    # 1. List scenarios (should include 4 built-ins)
    resp = await client.get("/api/scenarios")
    assert resp.status_code == 200
    scenarios = resp.json()
    assert len(scenarios) >= 4

    # 2. Create custom scenario
    new_scenario = {
        "name": "Custom Drone Autopilot Choice",
        "description": "Select flight controller MCU.",
        "category": "Robotics",
        "raw_prompt": "Which MCU for flight controller?",
        "state_mode": "text",
        "state_content": "Hard real time loop at 8kHz.",
        "questions": {
            "mcu": {
                "type": "choice",
                "instructions": "Pick MCU",
                "criteria": {"stm32h7": "High perf ARM Cortex-M7", "rp2350": "Dual core RISC-V/ARM"}
            }
        },
        "thresholds": {"reject": 0.30, "commit": 0.70}
    }
    create_resp = await client.post("/api/scenarios", json=new_scenario)
    assert create_resp.status_code == 200
    created = create_resp.json()
    scenario_id = created["id"]
    assert created["name"] == "Custom Drone Autopilot Choice"
    assert created["is_builtin"] is False

    # 3. Get single scenario
    get_resp = await client.get(f"/api/scenarios/{scenario_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == scenario_id

    # 4. Update scenario
    update_resp = await client.put(f"/api/scenarios/{scenario_id}", json={"name": "Updated Drone Controller"})
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Drone Controller"

    # 5. Delete scenario
    del_resp = await client.delete(f"/api/scenarios/{scenario_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["deleted"] is True

@pytest.mark.asyncio
async def test_runs_api(client):
    # List runs
    resp = await client.get("/api/runs")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data

    if data["items"]:
        run_id = data["items"][0]["id"]
        # Get run detail
        detail_resp = await client.get(f"/api/runs/{run_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["id"] == run_id

        # Export JSON
        export_json = await client.get(f"/api/runs/{run_id}/export?format=json")
        assert export_json.status_code == 200

        # Export Markdown
        export_md = await client.get(f"/api/runs/{run_id}/export?format=markdown")
        assert export_md.status_code == 200
        assert "DecisionBench Run Report" in export_md.text
